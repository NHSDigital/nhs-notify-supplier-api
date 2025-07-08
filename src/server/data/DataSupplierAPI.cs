// Configure the HTTP request pipeline.
using System.Collections.Concurrent;
using abstractions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

public class DataSupplierAPI : ISupplierAPI
{
  public void AddSupplierAPI(SuppliersApiConfigurationBuilder supplierConfig)
  {
    supplierConfig.ConfigureServices((services, o) =>
    {
      if (o.Data)
      {
        services.AddSingleton<ConcurrentDictionary<string, DataRequestBody>>(sp =>
        {
          var options = sp.GetRequiredService<IOptions<SuppliersApiOptions>>();
          var use = options.Value.Data;
          if (use)
          {
            return new ConcurrentDictionary<string, DataRequestBody>();
          }

          throw new NotImplementedException();
        });
      }
      ;
    }).UseApi((app, o) =>
    {
      if (o.Data)
      {
        DataApiExtensions.UseDataApi(app);
      }
    });
  }
}
