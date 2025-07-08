using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using abstractions;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSuppliersApi(
  builder.Configuration,
  suppliersApiBuilder =>
  {
<<<<<<< HEAD
    suppliersApiBuilder
      .FromAssemblies()
      .ConfigureOptions(suppliersOptions =>
      {
      });
=======
    suppliersApiBuilder.FromAssemblies();
    suppliersApiBuilder.ConfigureOptions(suppliersOptions =>
    {
    });
>>>>>>> d8aaf7e (Robu6/libs nuget example (#57))
  });

var app = builder.Build();


//if (app.Environment.IsDevelopment())
//{
  app.UseSwagger();
  app.UseSwaggerUI();
//}

app.UseHttpsRedirection();
app.UseSupliersApi();


app.Run();
