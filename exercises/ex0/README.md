# Getting started

In the exercises, you will create two CAP applications.
One of them is _xflights_. This app holds data about flighs and

The second one is _xtravels_ .. uses 



In this document, `XX` is your laptop number.

## Preparation 1 - Install the cds toolkit

Open a console (Command Prompt).
<br>![](/exercises/ex0/images/00_01_0010.png)

Install the newest version of the _cds toolkit_ globally. In the console, run the command
```sh
npm add -g @sap/cds-dk
```

Check the version:
```sh
cds v
```
You should have version `9.x` of `cds` and `cds-dk`.

You may need to add `C:\Users\TE-XX\AppData\Roaming\npm` to the `PATH` environment variable.


## Preparation 2 - Setup workspace

Clone the repo for this session. It containes a folder _ws_ where you will be
developing the CAP applications. Go to that folder and start VS Code.

```sh
mkdir teched-ad161
cd teched-ad161
mkdir ws
cd ws
```


```sh
cd C:\Users\TE-XX
git clone https://github.com/SAP-samples/teched2025-AD161.git
cd techeed2025-AD161
cd ws
code .
```

You should see this folder structure:
<br>![](/exercises/ex0/images/00_02_0010.png)

Ignore folder _xtravels_ for the time being, it will only be used in [Exercise 2](../ex2/README.md).


## Preparation 3 - Copying 

In the course of the exercises, you need to copy some files from [assets](../assets)
into the workspace. The simplest way to do this is to open folder _C:\Users\TE-XX\techeed2025-AD161\assets_
in Windows Explorer and then copy the files from there.




## Summary

You have now installed the _cds toolkit_ and prepared the worskspace.
Continue to - [Exercise 1 - Build CAP app XFlights](../ex1/README.md)
