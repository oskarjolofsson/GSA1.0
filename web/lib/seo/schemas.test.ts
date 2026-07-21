import { describe, it, expect } from "vitest";
import { FAQ } from "@/content/faq";
import { SITE } from "@/content/site";
import {
  faqPageSchema,
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from "./schemas";

describe("faqPageSchema", () => {
  it("describes exactly the FAQ that is rendered", () => {
    const schema = faqPageSchema();
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(FAQ.length);
  });

  it("carries each question and answer verbatim", () => {
    // This is the guard against schema/page drift. It can only fail if someone
    // stops reading from content/faq.ts.
    const { mainEntity } = faqPageSchema();
    FAQ.forEach((item, i) => {
      expect(mainEntity[i].name).toBe(item.q);
      expect(mainEntity[i].acceptedAnswer.text).toBe(item.a);
      expect(mainEntity[i]["@type"]).toBe("Question");
      expect(mainEntity[i].acceptedAnswer["@type"]).toBe("Answer");
    });
  });
});

describe("softwareApplicationSchema", () => {
  const schema = softwareApplicationSchema();

  it("has the fields Google needs for an app rich result", () => {
    expect(schema["@type"]).toBe("SoftwareApplication");
    expect(schema.operatingSystem).toBe("iOS");
    expect(schema.applicationCategory).toBe("HealthAndFitnessApplication");
    expect(schema.name).toBe(SITE.name);
    expect(schema.description.length).toBeGreaterThan(0);
  });

  it("omits offers while the price is unconfirmed", () => {
    // Publishing a price here that disagrees with the App Store is worse than
    // publishing none, because Google will surface it.
    expect(schema).not.toHaveProperty("offers");
  });
});

describe("all schemas", () => {
  const all = [
    organizationSchema(),
    websiteSchema(),
    softwareApplicationSchema(),
    faqPageSchema(),
  ];

  it("declare a schema.org context", () => {
    for (const schema of all) {
      expect(schema["@context"]).toBe("https://schema.org");
    }
  });

  it("survive JSON serialisation with no undefined leaking", () => {
    // JsonLd.tsx stringifies these straight into the page. `undefined` silently
    // disappears in JSON.stringify, so a typo'd field would vanish unnoticed.
    for (const schema of all) {
      const json = JSON.stringify(schema);
      expect(json).not.toContain("undefined");
      expect(() => JSON.parse(json)).not.toThrow();
    }
  });
});
