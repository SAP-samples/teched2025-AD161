# Exercise 4 - Deploy to SAP HANA Cloud

In this exercise, we will deploy the database model of the xtravels app
to an instance of SAP HANA Cloud and connect the Data Product entity `Customer`
to a BDC tenant.
We will run the xtravels app in hybrid mode: the app still runs locally on your laptop,
but is connected to an HDI container in a HANA Cloud instance.


## Exercise 4.1 - Log on to Cloud Foundry

After completing these steps you will have executed a few preparation steps
that are necessary before we can deploy to SAP HANA Cloud.

We have prepared a subaccount in SAP BTP that has access to an instance of SAP HANA Cloud.
In the subaccount, there already are users users for this exercise.
Your username is `capworkshopuser+0XX@gmail.com`, where `XX` is the number
assigned to you in the beginning of the session.



1. Use the Cloud Foundry command line interface to log on:
  ```sh
  cf l -a https://api.cf.eu10-005.hana.ondemand.com --origin aoykcp1ee-platform
  ```

2. At the prompt, provide user and password (replace XX with your number):
  ```
  User: capworkshopuser+0XX@gmail.com
  Password: ...
  ```


You can access BTP Cockpit for the subaccount ...



3. In a later step we need a user provided Cloud Foundry service.
The credentials for this service are defined in file _xtravels/grantor-dp-admin.json_.
Open this file in VS Code and replace the three dots by the password.

4. Go to the xtravels terminal and create the service by running
    ```sh
    cf cups grantor-dp-admin -p grantor-dp-admin.json
    ```


## Exercise 4.2 - Deploy to SAP HANA Cloud

1. Before we actually deploy, go to the xtravels terminal and run
    ```sh
    cds build --for hana
    ```

2. Look at the build output in _xtravels/gen/db/src/gen_.
The Data Product entities are still mocked, so you will find corresponding
_.hdbtable_ files, like _sap.s4com.Customer.v1.Customer.hdbtable_.

3. Deploy the database schema of your xtravels app to SAP HANA Cloud: In the xtravels terminal, run
    ```sh
    cds deploy --to hana
    ```
    This will automatically create an HDI container in the HANA Cloud instance and 
    deploy the database model of your app to it.


You can see the HDI container in ...

Note that a file `.cdsrc-private.json` has been created in the _xtravels_ folder.


## Exercise 4.3 - Run in hybrid mode

After completing these steps you will have your xtravels app running locally on your laptop,
connected to a SAP HANA Cloud instance.

1. Start `cds watch` in hybrid mode: In the xtravels terminal, run
    ```sh
    cds watch --profile hybrid
    ```

2. Observe the console output. It shows that the app is started locally,
but this time it is connected to the HANA Cloud instance:
    ```
    [cds] - connect to db > hana {
      database_id: '...',
      host: '...hanacloud.ondemand.com',
      port: '443',
      driver: 'com.sap.db.jdbc.Driver',
      url: '...',
      schema: '...',
      certificate: '...',
      hdi_user: '...',
      hdi_password: '...',
      user: '...',
      password: '...'
    }
    ```
    For the Data Product entity, still a regular table is created and filled with the test data.

3. Open the [xtravels web app](http://localhost:4004/travels/webapp/index.html).
You can still see the same test data as before, but now the data isn't coming from an
SQLite in-memory database, but from a (mock table in the) HANA instance.

4. Stop `cds watch` by typing `Ctrl+C` into the xtravels terminal.



## Exercise 4.4 - Connect to BDC share

After completing these steps you will have connected the Data Product entity
in your CDS model with a delta share in a real BDC tenant.

In this exercise, we focus on the CAP part of the integration. We have already
* prepared a BDC tenant with a share for the Data Product "Customer"
* a HANA remote source in our HANA instance, which points to the share
* a schema in our HANA instance, wich virtual tables pointing to the share tables in the BDC tenant

<br>![](/exercises/ex4/images/04_04_0010.png)

We will now connect the Data Product XXX in the xtravels app to these virtual tables via synonyms.

We could create the necessary _.hdbsynonym_ files manually, but this is a bit tedious.
The xtravels app already contains a build plugin, which modifies the output of `cds build`
accordingly: it replaces the _.hdbtable_ files with respective synonyms.

In order for the script to become active, we need to do some configuration.
We want to tell that the virtual tables for Data Product Customer can be found in schema `DP_VT_CUSTOMER`.

For this, go to file _xtravels/package.json_ and add a `cds` section:
```jsonc
{
  // ...
  "cds": {
    "requires": {
      "sap.s4com.Customer.v1": {
        "schema": "DP_VT_CUSTOMER"
      }
    }
  }
}
```

To see the effects of the plugin, in the xtravels terminal, run
```sh
cds build --for hana
```
and look at the build output in _xtravels/gen/db/src/gen_:
there no longer is a file _sap.s4com.Customer.v1.Customer.hdbtable_,
but instead a synonym file _sap.s4com.Customer.v1.Customer_syn.hdbsynonym_.
There is also a corresponding view _...Customer.hdbview_, which aligns the
names in BDC, which are case sensitive, to the "unquoted" names in CAP CDS.


Before we can deploy the synonyms, we need to ensure that the HDI user has the privileges
to access the objects in the external schema _DP_VT_CUSTOMER_.
For this we use the granting mechanism of HDI.

In folder _xtravels/db_, add a folder _src_.
In this new folder, add a file _.hdbgrants_.

<br>![](/exercises/ex4/images/04_04_0020.png)

Add this content into the new file:
```json
{
  "grantor-dp-admin": {
    "object_owner": { 
      "schema_privileges" : [
        {
          "schema" : "DP_VT_CUSTOMER",
          "privileges" : [ "SELECT" ],
          "privileges_with_grant_option" : [ "SELECT" ]
        }
      ]
    }
  }
}
```
Upon deployment, HDI will use the user provided service `grantor-dp-admin` to
grant the required privileges to the HDI user.


We need to bind the user provided service `grantor-dp-admin` that
we have created in the beginning of this exercise.
Go to the xtravels terminal and run
```sh
cds bind grantor-dp-admin --to grantor-dp-admin
```
This adds a corresponding entry to _xtravels/.cdsrc-private.json_.


Then deploy with
```sh
cds bind --exec -- cds deploy --to hana
```

After successful deployment, entity `Customer` is now connected via a synonym
to a virtual table in schema `DP_VT_CUSTOMER`, which via a HANA Remote Source
points to a delta share table in a BDC tenant filled with sample data of an S/4
test system.


You can now again start the app in hybrid mode:
```sh
cds watch --profile hybrid
```

Go to the [xtravels web app](http://localhost:4004/travels/webapp/index.html)
and look at the data. You will notice that the customer data (names, address, ...)
has changed, because you no longer see the local mock data, but the data from the BDC tenant.



## Summary




