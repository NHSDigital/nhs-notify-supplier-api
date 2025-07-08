using System.Reflection.Metadata.Ecma335;
using Microsoft.AspNetCore.Http;
namespace abstractions;

public class SuppliersApiOptions
{
  public static string Position = "SuppliersApi";

  public List<string> Assemblies { get; set; } = new();
  public bool Letters { get; set; }
  public bool Data { get; set; }

}
