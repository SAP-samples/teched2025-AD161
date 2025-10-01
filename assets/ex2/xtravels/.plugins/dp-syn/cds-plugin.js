'use strict'

// This plugin enhances "cds.compile.to.hana" for Data Product consumption:
// For the entities in the Data Product, synonyms and mapping views are generated
//   instead of tables. Generation of .hdbtabledata files is suppressed.
// We handle entities that are part of a service that
// - has annotation @data.product
// - has annotation @cds.external
// - has an entry in cds.env.requires
// - and this requires entry contains a "schema" property
//
// Mapping view selects from synonym and simply maps quoted element name to unquoted one.
// Synonym points to virtual table in target schema, assuming that name of VT is
//   equal to the entity name without service prefix

// Example:
//  service: sap.s4com.Customer.v1
//  entity:  sap.s4com.Customer.v1.Customer
//
// entity <--- "same name" ---> mapping view ........................SAP_S4COM_CUSTOMER_V1_CUSTOMER
//                               | selects from
//                               V  
//                              synonym..............................SAP_S4COM_CUSTOMER_V1_CUSTOMER_SYN
//                               | points to
//                               V
//                              virtual table........................CUSTOMER
//                                 in schema <target_schema>

const cds = require('@sap/cds');
const { csv } = require('@sap/cds/lib/compile/load');
const toHdi = cds.compile.to.hana;
const { path } = cds.utils

function getDPServices(csn) {
  // get services for consumed DPs
  let dp_services = Object.entries(csn.definitions)
    .filter( ([, def]) => def.kind === 'service' && def['@data.product'] && def['@cds.external']);
  //console.log('DP services:', dp_services);

  function getSchema(x) {
    return (cds.env.requires && cds.env.requires[x] && cds.env.requires[x].schema) ? cds.env.requires[x].schema : null;
  }
  dp_services = dp_services.map(([n,]) => [n, getSchema(n)]).filter(([,s]) => s)
  //console.log('DP services with schema:', dp_services);

  return dp_services;
}


cds.compile.to.hana = function (csn, options, ...etc) {
  console.log('######### patch plugin start #########');

  const results = [];
  const hdiResult = toHdi(csn, options, ...etc);
  //console.log(JSON.stringify(hdiResult, null, 2));
  let toBeRemoved = [];

  // get services for consumed DPs
  let dp_services = getDPServices(csn);

  for (const n in csn.definitions) {
    // only look at entities that belong to DP service
    let srv = dp_services.find( ([svc_name, ]) => n.startsWith(svc_name + '.'))
    if (!srv) continue;
    let srv_name = srv[0];
    let vt_schema = srv[1];

    let entity = csn.definitions[n];
    if (entity.kind === 'entity')
    {
      console.log('entity name: ', n)
      //console.log('service name:', srv_name);
      //console.log('schema name: ', vt_schema);
      
      // let [ , coren] = n.match(/^sap\.sai\.\w+\.(\w+)DDP$/);
                                                // example: n = sap.s4com.Customer.v1.Customer
      let nU     = n.toUpperCase().replace(/\./g, '_');      // SAP_S4COM_CUSTOMER_V1_CUSTOMER
      let coren  = n.substring(srv_name.length + 1);         // Customer
      let corenU = coren.toUpperCase().replace(/\./g, '_');  // CUSTOMER
      let view_name     = nU;                                // SAP_S4COM_CUSTOMER_V1_CUSTOMER
      let view_filename = `${n}.hdbview`;                    // sap.s4com.Customer.v1.Customer.hdbview
      let syn_name      =  nU + '_SYN';                      // SAP_S4COM_CUSTOMER_V1_CUSTOMER_SYN
      let syn_filename  = `${n}_syn.hdbsynonym`;             // sap.s4com.Customer.v1.Customer_syn.hdbsynonym
      let vt_name       = corenU;                            // CUSTOMER

      //console.log('view name:         ', view_name);
      //console.log('view file name:    ', view_filename);
      //console.log('synonym name:      ', syn_name)
      //console.log('synonym file name: ', syn_filename);
      //console.log('virtual table name:', vt_name)

      // mapping view
      let elems = entity.elements
      let plain_elems = Object.keys(elems).filter( e => elems[e].type !== 'cds.Association' && elems[e].type !== 'cds.Composition');
      // get length of longest element name, for aligning the aliases
      let max_len = plain_elems.reduce( (max, e) => Math.max(max, e.length), 0);
      const pad = (e, l) => ' '.repeat(l - e.length);
      let proj_list = plain_elems.map( e => `  "${e}"${pad(e, max_len)} AS "${e.toUpperCase()}"`).join(',\n');
      let view_content = `VIEW ${view_name} AS SELECT\n${proj_list}\nFROM ${syn_name}`;
      results.push([view_content, {file: view_filename}]);
      toBeRemoved.push(n + '.hdbtable');

      // synonym
      let syn_content = {};
      syn_content[syn_name] = {
        "target": {
          "object": vt_name,
          "schema": vt_schema
        }
      }
      results.push([JSON.stringify(syn_content, null, 2),  {file: syn_filename}]);

      //console.log('------------------------------');
    }
  }

// removing sap.s4com.Customer.v1.Customer.hdbtable

  for(const result of hdiResult) {
    let content = result[0];
    let file = result[1];
    if (toBeRemoved.includes(file.file)) {
      //console.log('remove', file.file);
    }
    else {
      results.push(result);
    }
  }

  console.log('######### patch plugin end #########');
  return results;
}




// remove .hdbtabledata files from the build result
// TODO can we also remove the corresponding csv files?

let old_hdbtabledata = cds.compile.to.hdbtabledata

cds.compile.to.hdbtabledata = async (model, options = {}) => {
  console.log("######### hdbtabledata patch plugin start #########")

  // get services for consumed DPs
  let dp_services = getDPServices(model);

  let toBeRemoved = [];
  for (const n in model.definitions) {
    let srv = dp_services.find( ([svc_name, ]) => n.startsWith(svc_name + '.'))
    if (!srv) continue;

    let entity = model.definitions[n];
    if (entity.kind === 'entity')
    {
                                                    // example: n = sap.s4com.Customer.v1.Customer
      let table_name = n.toUpperCase().replace(/\./g, '_');      // SAP_S4COM_CUSTOMER_V1_CUSTOMER
      // console.log('entity name: ', n)
      // console.log('table:       ', table_name);
      toBeRemoved.push(table_name);
    }
  }

  let res = await old_hdbtabledata(model, options)
  let newres = []
  for (const val of res) {
    let imports = val[0].imports[0]
    let table_name = imports.target_table

    if (toBeRemoved.find(x => x === table_name)) {
      console.log('remove .hdbtabledata for ', table_name ) 
    } else {
      newres.push(val)
    }
  }

  console.log("######### hdbtabledata patch plugin end #########")
  // caller expects a generator object
  return _toOutput(newres)
}


function* _toOutput(datas) {
  for (let i = 0; i < datas.length; i++) {
    if (datas[i]) yield datas[i]
  }
}

