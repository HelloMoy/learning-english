import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import {
  forgotPasswordSchema,
  formErrors,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./account-form-schemas";

const valid = () => ({
  name: faker.person.firstName(),
  email: faker.internet.email(),
  password: faker.internet.password({ length: 12 }),
});

describe("formErrors", () => {
  test("WHEN every field is valid THEN there are no errors", () => {
    expect(formErrors(signUpSchema, valid())).toEqual({});
  });

  test("WHEN the password is 7 characters THEN it is refused with the length message", () => {
    expect(formErrors(signUpSchema, { ...valid(), password: "1234567" })).toEqual({
      password: "passwordLength",
    });
  });

  test("WHEN the password is 129 characters THEN it is refused with the length message", () => {
    expect(formErrors(resetPasswordSchema, { password: "x".repeat(129) })).toEqual({
      password: "passwordLength",
    });
  });

  test("WHEN the email is malformed or blank THEN it is refused", () => {
    expect(formErrors(forgotPasswordSchema, { email: "ana@" })).toEqual({ email: "emailInvalid" });
    expect(formErrors(signInSchema, { email: "  ", password: "x".repeat(8) })).toEqual({
      email: "emailInvalid",
    });
  });

  test("WHEN the name is blank or longer than a learner card holds THEN it is refused", () => {
    expect(formErrors(signUpSchema, { ...valid(), name: "   " })).toEqual({ name: "nameRequired" });
    expect(formErrors(signUpSchema, { ...valid(), name: "x".repeat(41) })).toEqual({
      name: "nameTooLong",
    });
  });

  test("WHEN several fields are wrong THEN each reports its own first problem", () => {
    expect(formErrors(signUpSchema, { name: "", email: "x", password: "" })).toEqual({
      name: "nameRequired",
      email: "emailInvalid",
      password: "passwordLength",
    });
  });
});
