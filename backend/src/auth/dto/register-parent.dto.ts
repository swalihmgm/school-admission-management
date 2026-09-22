import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterParentDto {
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  phone: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsNotEmpty({ message: 'Confirm password is required' })
  @IsString()
  confirmPassword: string;
}
