// Configure the HTTP request pipeline.




public record struct LetterResponseBody(string Id, string Status)
{
    public static LetterResponseBody FromLetterRequestBody(LetterRequestBody request)
    {
        return new LetterResponseBody(Guid.NewGuid().ToString(), request.Status);
    }
}
