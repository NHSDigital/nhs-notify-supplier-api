// Configure the HTTP request pipeline.




using System.Collections.Concurrent;
using abstractions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

public static class LettersApiExtensions
{
  public static SuppliersApiConfigurationBuilder AddLetters(this SuppliersApiConfigurationBuilder supplierConfig)
  {
    var apiAdder = new LettersSupplierAPI();
    apiAdder.AddSupplierAPI(supplierConfig);
    return supplierConfig;
  }

  public static void UseLettersApi(this IApplicationBuilder appBuilder)
  {
    var app = (WebApplication)appBuilder;

    var options = app.Services.GetRequiredService<IOptions<SuppliersApiOptions>>();
    var useLetters = options.Value.Letters;
    if (!useLetters)
      return;

    app.MapGet("/letter", ([FromServices] ConcurrentDictionary<string, LetterResponseBody> letters) =>
    {
      var all = letters.ToList().Select(x => x.Value);
      return all;
    })
    .WithName("GetLetter")
    .WithOpenApi()
    .WithTags("LetterApi");

    app.MapPost("/letter", ([FromBody] LetterRequestBody body, [FromServices] ConcurrentDictionary<string, LetterResponseBody> letters) =>
    {
      var response = LetterResponseBody.FromLetterRequestBody(body);
      letters.TryAdd(response.Id, response);
      return response;

    })
    .WithName("PostLetter")
    .WithOpenApi()
    .WithTags("LetterApi");

    app.MapGet("/letter/{id}", (string id, [FromServices] ConcurrentDictionary<string, LetterResponseBody> letters) =>
    {
      return letters.GetValueOrDefault(id);
    })
    .WithName("GetLetterId")
    .WithOpenApi()
    .WithTags("LetterApi");

    app.MapPatch("/letter/{id}", (string id, [FromBody] LetterRequestBody body, [FromServices] ConcurrentDictionary<string, LetterResponseBody> letters) =>
    {
      var letter = letters.GetValueOrDefault(id);
      letter = letter with { Status = body.Status };
      letters.Remove(id, out _);
      letters.TryAdd(id, letter);
    })

    .WithName("PostLetterId")
    .WithOpenApi()
    .WithTags("LetterApi");
  }
}
