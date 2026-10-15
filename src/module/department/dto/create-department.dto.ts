
import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsMongoId()
  @IsNotEmpty()
  hospital: string;

  
}
