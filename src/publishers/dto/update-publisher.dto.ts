import { IsOptional, IsString } from 'class-validator';

export class UpdatePublisherDto {
  @IsOptional()
  @IsString()
  name?: string;
}
