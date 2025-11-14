import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'username is required' })
  username!: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  password!: string;
}

export class LoginResponseDto {
  access_token!: string;
  user!: {
    id: number;
    name: string;
    username: string;
  };
}
