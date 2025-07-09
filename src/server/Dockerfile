# Multi-stage Dockerfile for .NET 8 Web API
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and restore as distinct layers
COPY .version ./
COPY build.sh ./
COPY server.sln ./
COPY host/host.csproj ./host/
COPY abstractions/abstractions.csproj ./abstractions/
COPY data/data.csproj ./data/
COPY letter/letter.csproj ./letter/
COPY . .

RUN ./build.sh

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build src/host/bin/Release/net8.0/publish .

# Expose port (change if your app uses a different port)
EXPOSE 8080

# Set environment variables (optional)
# ENV ASPNETCORE_URLS=http://+:80
RUN ls -la

ENTRYPOINT ["./run.sh"]
