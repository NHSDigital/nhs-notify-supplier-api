// Configure the HTTP request pipeline.




using System.Collections.Concurrent;
using abstractions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

public static class DataApiExtensions
{
  private static string TagName = "DataApi";
  public static SuppliersApiConfigurationBuilder Adddata(this SuppliersApiConfigurationBuilder supplierConfig)
  {
    var apiAdder = new DataSupplierAPI();
    apiAdder.AddSupplierAPI(supplierConfig);
    return supplierConfig;
  }

  public static void UseDataApi(this IApplicationBuilder appBuilder)
  {
    var app = (WebApplication)appBuilder;

    var options = app.Services.GetRequiredService<IOptions<SuppliersApiOptions>>();
    var useData = options.Value.Data;
    if (!useData)
      return;

    app.MapGet("/data", ([FromServices] ConcurrentDictionary<string, DataRequestBody> data) =>
    {
      var all = data.ToList().Select(x => x.Value);
      return all;
    })
    .WithName("GetData")
    .WithOpenApi()
    .WithTags(TagName);

    app.MapPost("/data", ([FromBody] DataRequestBody body, [FromServices] ConcurrentDictionary<string, DataRequestBody> data) =>
    {
      var response = body;
      data.TryAdd(response.Id, response);
      return response;

    })
    .WithName("PostData")
    .WithOpenApi()
    .WithTags(TagName);

    app.MapGet("/data/{id}", (string id, [FromServices] ConcurrentDictionary<string, DataRequestBody> data) =>
    {
      return data.GetValueOrDefault(id);
    })
    .WithName("GetDataId")
    .WithOpenApi()
    .WithTags(TagName);

    app.MapPatch("/data/{id}", (string id, [FromBody] DataRequestBody body, [FromServices] ConcurrentDictionary<string, DataRequestBody> data) =>
    {
      var d = data.GetValueOrDefault(id);
      d = body; //with { Status = body.Status };
      data.Remove(id, out _);
      data.TryAdd(id, d);
    })

    .WithName("PostDataId")
    .WithOpenApi()
    .WithTags(TagName);
  }
}
