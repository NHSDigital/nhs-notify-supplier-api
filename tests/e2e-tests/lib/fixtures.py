# for now this is the same as PROXY_NAME
# this is here to illustrate how these can be decoupled
@pytest.fixture(scope='session')
def api_product_name():
    try:
        return os.environ['API_PROXY']
    except KeyError:
        # fall back to PROXY_NAME
        return os.environ['PROXY_NAME']

@pytest.fixture(scope='session')
def url(api_product_name):
    # PR build naming: nhs-pr112-supapi
    if api_product_name is not None and api_product_name.startswith('nhs-pr'):
        pr_number = re.search(r'\d+', api_product_name).group()
        suffix = f"nhs-pr{pr_number}-supapi"
    else:
        suffix = "nhs-main-supapi"

    environment = os.environ['API_ENVIRONMENT']

    if environment == "prod":
        return "https://api.service.nhs.uk/nhs-main-supapi"

    elif environment in ["ref", "ref2"]:
        return "https://internal-dev.api.service.nhs.uk/nhs-main-supapi"

    else:
        return f"https://{environment}.api.service.nhs.uk/{suffix}"
