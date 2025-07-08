#! /bin/sh

SuppliersApi__Letters=true \
SuppliersApi__Data=true \
SuppliersApi__Assemblies__0=letter \
SuppliersApi__Assemblies__1=data \
dotnet nhs.notify.suppliers.api.host.dll
