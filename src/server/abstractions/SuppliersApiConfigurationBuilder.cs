using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Builder;
using System.Reflection;
namespace abstractions;

public record SuppliersApiUsings(List<Action<IApplicationBuilder, SuppliersApiOptions>> Actions);
public class SuppliersApiConfigurationBuilder
{
  private IConfiguration _configuration;
  private IServiceCollection _services;
  private List<Action<SuppliersApiOptions>> _optionActions = new List<Action<SuppliersApiOptions>>();
  private List<Action<IServiceCollection, SuppliersApiOptions>> _serviceActions = new List<Action<IServiceCollection, SuppliersApiOptions>>();
  private List<Action<IApplicationBuilder, SuppliersApiOptions>> _appBuilderActions = new();

  private bool fromAssemblies = false;

  public SuppliersApiConfigurationBuilder(IServiceCollection services, IConfiguration configuration)
  {
    _services = services;
    _configuration = configuration;
  }

  public SuppliersApiConfigurationBuilder ConfigureOptions(Action<SuppliersApiOptions> options)
  {
    _optionActions.Add(options);
    return this;
  }

  public SuppliersApiConfigurationBuilder ConfigureServices(Action<IServiceCollection, SuppliersApiOptions> options)
  {
    _serviceActions.Add(options);
    return this;
  }

  public SuppliersApiConfigurationBuilder UseApi(Action<IApplicationBuilder, SuppliersApiOptions> app)
  {
    _appBuilderActions.Add(app);
    return this;
  }

  public SuppliersApiConfigurationBuilder FromAssemblies()
  {
    fromAssemblies = true;
    return this;
  }

  public void Build()
  {
    SuppliersApiOptions opts = new();
    var section = _configuration.GetSection(SuppliersApiOptions.Position);
    section.Bind(opts);
    foreach (var action in _optionActions)
    {
      action(opts);
    }

    if (fromAssemblies)
    {
      foreach (var assembly in opts.Assemblies)
      {
        var ass = Assembly.Load(assembly);
        var intType = typeof(ISupplierAPI);

        var allTypes = ass.GetTypes().ToList();
        foreach (var t in allTypes)
        {
          Console.WriteLine(t.FullName);
          var interfaces = t.GetInterfaces().ToList();
          foreach (var i in interfaces)
          {
            Console.WriteLine($"\t{i}");
            if (intType.FullName == i.FullName)
            {
              var supplierApi = Activator.CreateInstance(t);
              var loader = supplierApi as ISupplierAPI;
              Console.WriteLine($"\t\tAdding {i}");
              loader?.AddSupplierAPI(this);
              Console.WriteLine($"\t\tAdded {i}");
            }
          }
        }
      }
    }

    _services.AddSingleton<IOptions<SuppliersApiOptions>>(sp =>
    {
      return Options.Create(opts);
    });

    _services.AddSingleton<SuppliersApiUsings>(sp => { return new SuppliersApiUsings(_appBuilderActions); });


    foreach (var srv in _serviceActions)
    {
      srv(_services, opts);
    }


  }
}
