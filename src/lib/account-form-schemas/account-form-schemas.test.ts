import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import {
  changeEmailSchema,
  changePasswordSchema,
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

  test("WHEN a password change carries both passwords THEN it is accepted", () => {
    expect(
      formErrors(changePasswordSchema, {
        currentPassword: faker.internet.password({ length: 12 }),
        newPassword: faker.internet.password({ length: 12 }),
      }),
    ).toEqual({});
  });

  test("WHEN the new password is too short THEN only it is refused", () => {
    expect(
      formErrors(changePasswordSchema, {
        currentPassword: faker.internet.password({ length: 12 }),
        newPassword: "1234567",
      }),
    ).toEqual({ newPassword: "passwordLength" });
  });

  test("WHEN the current password is missing THEN it is refused with the length message", () => {
    expect(
      formErrors(changePasswordSchema, {
        currentPassword: "",
        newPassword: faker.internet.password({ length: 12 }),
      }),
    ).toEqual({ currentPassword: "passwordLength" });
  });

  test("WHEN an email change carries a valid new address THEN it is accepted", () => {
    expect(
      formErrors(changeEmailSchema("ana@example.com"), { newEmail: faker.internet.email() }),
    ).toEqual({});
  });

  test("WHEN an email change carries a malformed address THEN it is refused", () => {
    expect(formErrors(changeEmailSchema("ana@example.com"), { newEmail: "ana@" })).toEqual({
      newEmail: "emailInvalid",
    });
  });

  test("WHEN an email change carries the address the account already holds THEN it is refused", () => {
    expect(
      formErrors(changeEmailSchema("ana@example.com"), { newEmail: "Ana@Example.com" }),
    ).toEqual({ newEmail: "emailUnchanged" });
  });

  test("WHEN several fields are wrong THEN each reports its own first problem", () => {
    expect(formErrors(signUpSchema, { name: "", email: "x", password: "" })).toEqual({
      name: "nameRequired",
      email: "emailInvalid",
      password: "passwordLength",
    });
  });
});
