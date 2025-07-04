FROM mcr.microsoft.com/dotnet/aspnet:8.0

WORKDIR /App
COPY csharp-server/src/nhsnotifysupplierserver/bin/Release/net8.0 .
RUN mkdir -p /workspaces/nhs-notify-supplier-api/server/csharp-server/src/nhsnotifysupplierserver/wwwroot
RUN mkdir -p /home/runner/work/nhs-notify-supplier-api/nhs-notify-supplier-api/server/csharp-server/src/nhsnotifysupplierserver/wwwroot
COPY csharp-server/src/nhsnotifysupplierserver/wwwroot/* /workspaces/nhs-notify-supplier-api/server/csharp-server/src/nhsnotifysupplierserver/wwwroot/
COPY csharp-server/src/nhsnotifysupplierserver/wwwroot/* /home/runner/work/nhs-notify-supplier-api/nhs-notify-supplier-api/server/csharp-server/src/nhsnotifysupplierserver/wwwroot/
RUN    ls -la /workspaces/nhs-notify-supplier-api/server/csharp-server/src/nhsnotifysupplierserver/wwwroot && \
    pwd
ENV ASPNETCORE_ENVIRONMENT="Development"
ENTRYPOINT ["dotnet", "nhsnotifysupplierserver.dll"]
