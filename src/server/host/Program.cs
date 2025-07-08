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
    suppliersApiBuilder
      .FromAssemblies()
      .ConfigureOptions(suppliersOptions =>
      {
      });
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
