using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Options;
using System.Reflection;
using System.Runtime.CompilerServices;
namespace abstractions;

public interface ISupplierAPI
{
  void AddSupplierAPI(SuppliersApiConfigurationBuilder supplierConfig);
}

public static class SuppliersApiExtensionMethods
{

  public static IApplicationBuilder UseSupliersApi(this IApplicationBuilder app)
  {
    var usings = app.ApplicationServices.GetRequiredService<SuppliersApiUsings>();
    var actionsToUse = usings.Actions;
    var options = app.ApplicationServices.GetRequiredService<IOptions<SuppliersApiOptions>>();
    foreach (var u in actionsToUse)
    {
      u(app, options.Value);
    }

    return app;

  }

  public static IServiceCollection AddSuppliersApi(
    this IServiceCollection services,
    IConfiguration configuration,
    Action<SuppliersApiConfigurationBuilder> suppliersApiBuilder)
  {
    var supplierConfiuration = new SuppliersApiConfigurationBuilder(services, configuration);
    suppliersApiBuilder(supplierConfiuration);

    supplierConfiuration.Build();
    return services;
  }


  public static SuppliersApiConfigurationBuilder FromAssemblies(this SuppliersApiConfigurationBuilder builder)
  {
    builder.FromAssemblies();

    return builder;
  }

  public static SuppliersApiConfigurationBuilder FromAssembly<T>(this SuppliersApiConfigurationBuilder builder)
  {
    var intType = typeof(ISupplierAPI);
    var type = typeof(T);
    var allTypes = type.Assembly.GetTypes().ToList();
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
          loader?.AddSupplierAPI(builder);
          Console.WriteLine($"\t\tAdded {i}");

        }

      }
    }

    return builder;
  }
}
