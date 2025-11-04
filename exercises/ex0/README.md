# Preparation

In this session, you will create two CAP applications. The apps are developed locally
using Visual Studio Code and the [_cds toolkit_](https://cap.cloud.sap/docs/tools/cds-cli).
In this preparation section, you install the _cds toolkit_ and set up the local workspace
where you develop the apps.


## Preparation 1 - Install latest version of the cds toolkit

1. Open a console (Command Prompt).
    <br>![](/exercises/ex0/images/00_01_0010.png)

2. Install the latest version of the [_cds toolkit_](https://cap.cloud.sap/docs/tools/cds-cli) globally. In the console, run the command
    ```sh
    npm i -g @sap/cds-dk --prefix "C:\software\CLI\CDS"
    ```
    > The --prefix option is only needed due to the setup of the TechEd machines. If you are running this tutorial on your own machine, omit it.

3. Check the version:
    ```sh
    cds v
    ```
    You should have version `9.4.4` of `@sap/cds`.



## Preparation 2 - Setup workspace

On the TechEd machines, you have a local user of the form `EMEAnnnn` (with `nnnn` being some number).

To set up your workspace, first go to your user's folder
(if the console hasn't already opened in this directory):

```sh
cd C:\Users\EMEAnnnn
```

Once in this folder, clone the repo of this session, move into the `ws` folder within it,
and then open it with VS Code:

```sh
git clone https://github.com/SAP-samples/teched2025-AD161.git
cd teched2025-AD161\ws
code .
```

The `ws` folder is where you will be developing the CAP applications.

You should see this folder structure:

<br>![](/exercises/ex0/images/00_02_0010.png)

Ignore folder _xtravels_ for the time being, it will only be used in [Exercise 2](../ex2/README.md).



## Preparation 3 - (optional) Activate auto-save

Each time you change a file in the course of this exercise, don't forget to save with `Ctrl+S` or via the "File" menu.
Alternatively, you can also activate the "Auto Save" feature of VS Code via the "File" menu.



## Preparation 4 - Copying 

In the course of the exercises, you will need to copy some files from the [assets](../../assets) folder
into the workspace. The simplest way to do this is to open folder _C:\Users\EMEAnnnn\teched2025-AD161\assets_
(with `EMEAnnn` being your user name)
in Windows Explorer and then copy the files from there into VS Code via Drag & Drop.



## Summary

You have now installed the _cds toolkit_ and prepared the workspace.

Continue to - [Exercise 1 - Build CAP app xflights](../ex1/README.md)
