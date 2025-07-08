// Configure the HTTP request pipeline.




using System.Collections.Concurrent;
using abstractions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

public class LettersSupplierAPI : ISupplierAPI
{
  public void AddSupplierAPI(SuppliersApiConfigurationBuilder supplierConfig)
  {
    supplierConfig.ConfigureServices((services, o) =>
    {
      if (o.Letters)
      {
        services.AddSingleton<ConcurrentDictionary<string, LetterResponseBody>>(sp =>
        {
          var options = sp.GetRequiredService<IOptions<SuppliersApiOptions>>();
          var useLetters = options.Value.Letters;
          if (useLetters)
          {
            return new ConcurrentDictionary<string, LetterResponseBody>();
          }

          throw new NotImplementedException();
        });
      }
      ;
    }).UseApi((app, o) =>
    {
      if (o.Letters)
      {
        LettersApiExtensions.UseLettersApi(app);
      }
    });
  }
}
