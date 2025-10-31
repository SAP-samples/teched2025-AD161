# HANA Setup

Based on a URL <hdlfs-url> to a HDLFS container and a certificate that
grants access, the HANA objects for this session were created like this:

```sql
CREATE PSE PSE_BDC;
ALTER PSE PSE_BDC SET OWN CERTIFICATE '<certificate>';

CREATE REMOTE SOURCE RS_BDC 
  ADAPTER "deltasharing" CONFIGURATION 'provider=hdlf;endpoint=<hdlfs-url>;'
  WITH CREDENTIAL TYPE 'X509' PSE PSE_BDC;

CREATE VIRTUAL TABLE Customer        AT RS_BDC."sap.s4com.customer:v1"."customer"."customer";
CREATE VIRTUAL TABLE CustomerDunning AT RS_BDC."sap.s4com.customer:v1"."customer"."customerdunning";
-- ...
```
