# Getting started

In this session, you will create two CAP applications. The apps are developed locally
using Visual Studio Code and the _cds toolkit_.
In this preparation section we install the _cds toolkit_ and set up the local workspace
where you develop the apps.

In this document, `XX` is the number that has been assigned to you for this session.

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
You should have version `9.4.x` of `cds` and `cds-dk`.

You may need to add `C:\Users\TE-XX\AppData\Roaming\npm` to the `PATH` environment variable.


## Preparation 2 - Setup workspace

Clone the repo for this session. It containes a folder _ws_ where you will be
developing the CAP applications. Go to that folder and start VS Code.
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

In the course of the exercises, you will need to copy some files from [assets](../assets)
into the workspace. The simplest way to do this is to open folder _C:\Users\TE-XX\teched2025-AD161\assets_
in Windows Explorer and then copy the files from there into VS Code via Drag & Drop.


## Summary

You have now installed the _cds toolkit_ and prepared the worskspace.

Continue to - [Exercise 1 - Build CAP app xflights](../ex1/README.md)
