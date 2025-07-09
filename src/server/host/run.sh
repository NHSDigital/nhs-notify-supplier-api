#! /bin/sh

SuppliersApi__Letters=true \
SuppliersApi__Data=true \
SuppliersApi__Assemblies__0="nhs.notify.suppliers.api.letter" \
SuppliersApi__Assemblies__1="nhs.notify.suppliers.api.data" \
ASPNETCORE_ENVIRONMENT="Development" \
dotnet nhs.notify.suppliers.api.host.dll
