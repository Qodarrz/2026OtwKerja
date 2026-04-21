export class RegisterDto {
  email!: string;
  password!: string;
  name?: string;
}

export class LoginDto {
  email!: string;
  password!: string;
}

export class VerifyOtpDto {
  email!: string;
  otp!: string;
}

export class ResendOtpDto {
  email!: string;
}
