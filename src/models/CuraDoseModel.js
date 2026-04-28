export class CuraDoseUser {
  constructor({ id, name, email, role, emailVerificationRequired = false }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.emailVerificationRequired = emailVerificationRequired;
  }
}
