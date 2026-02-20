import { $PackSpecification, PackSpecification } from "./pack-specification";

describe("Specification schema validation", () => {
  const standardLetterSpecification: PackSpecification = {
    id: "standard-letter",
    name: "Standard Economy-class Letter",
    status: "INT",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
    version: 1,
    postage: {
      id: "economy",
      size: "STANDARD",
      deliveryDays: 4,
    },
    assembly: {
      envelopeId: "nhs-economy",
      printColour: "BLACK",
    },
  };

  it("should validate a standard letter specification", () => {
    expect(() =>
      $PackSpecification.strict().parse(standardLetterSpecification),
    ).not.toThrow();
  });

  it("should accept a letter specification with unrecognised fields", () => {
    expect(() =>
      $PackSpecification.parse({
        ...standardLetterSpecification,
        additionalField: { some: "data" },
      }),
    ).not.toThrow();
  });

  it("should validate a specification with optional description", () => {
    const specWithDescription: PackSpecification = {
      ...standardLetterSpecification,
      description: "A standard economy-class letter for bulk mailings",
    };

    expect(() =>
      $PackSpecification.strict().parse(specWithDescription),
    ).not.toThrow();
  });

  it("should validate a specification without description", () => {
    const specWithoutDescription: PackSpecification = {
      ...standardLetterSpecification,
    };

    expect(() =>
      $PackSpecification.strict().parse(specWithoutDescription),
    ).not.toThrow();
  });

  it("should validate a specification with duplex set to true", () => {
    const specWithDuplex: PackSpecification = {
      ...standardLetterSpecification,
      assembly: {
        ...standardLetterSpecification.assembly,
        duplex: true,
      },
    };

    expect(() =>
      $PackSpecification.strict().parse(specWithDuplex),
    ).not.toThrow();
  });

  it("should validate a specification with duplex set to false", () => {
    const specWithoutDuplex: PackSpecification = {
      ...standardLetterSpecification,
      assembly: {
        ...standardLetterSpecification.assembly,
        duplex: false,
      },
    };

    expect(() =>
      $PackSpecification.strict().parse(specWithoutDuplex),
    ).not.toThrow();
  });

  it("should validate a specification without duplex field", () => {
    const specWithoutDuplexField: PackSpecification = {
      ...standardLetterSpecification,
    };

    expect(() =>
      $PackSpecification.strict().parse(specWithoutDuplexField),
    ).not.toThrow();
  });

  it("should validate a specification with constraints", () => {
    const specWithConstraints: PackSpecification = {
      ...standardLetterSpecification,
      constraints: {
        sheets: {
          value: 10,
          operator: "LESS_THAN",
        },
        deliveryDays: {
          value: 4,
          operator: "LESS_THAN",
        },
      },
    };

    expect(() =>
      $PackSpecification.strict().parse(specWithConstraints),
    ).not.toThrow();
  });

  it("should validate a specification with all constraint fields", () => {
    const specWithConstraints: PackSpecification = {
      ...standardLetterSpecification,
      constraints: {
        deliveryDays: {
          value: 5,
          operator: "EQUALS",
        },
        sheets: {
          value: 20,
          operator: "LESS_THAN",
        },
        sides: {
          value: 4,
          operator: "LESS_THAN",
        },
        blackCoveragePercentage: {
          value: 80,
          operator: "LESS_THAN",
        },
        colourCoveragePercentage: {
          value: 50,
          operator: "LESS_THAN",
        },
      },
    };

    expect(() =>
      $PackSpecification.strict().parse(specWithConstraints),
    ).not.toThrow();
  });

  it("should reject a specification with invalid constraint value", () => {
    const specWithInvalidConstraints = {
      ...standardLetterSpecification,
      constraints: {
        sheets: {
          value: "not a number",
          operator: "LESS_THAN",
        },
      },
    };

    expect(() =>
      $PackSpecification.strict().parse(specWithInvalidConstraints),
    ).toThrow();
  });

  it("should validate a specification without constraints", () => {
    expect(() =>
      $PackSpecification.strict().parse(standardLetterSpecification),
    ).not.toThrow();
  });
});
