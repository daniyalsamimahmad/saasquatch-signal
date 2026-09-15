import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const toArray = ({ value }: { value: unknown }) =>
  Array.isArray(value) ? value : value === undefined || value === '' ? undefined : [value];

export class SearchPeopleDto {
  @IsOptional()
  @IsString()
  q?: string; // free text over name / title / company

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  titles?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  seniorities?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  departments?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  locations?: string[]; // "Austin, TX" | "TX" | "United States"

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  industries?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employeesMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employeesMax?: number;

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  emailStatus?: string[]; // verified | guessed | unavailable | unknown

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  tech?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}

export class SearchCompaniesDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  industries?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  locations?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employeesMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employeesMax?: number;

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  tech?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  foundedMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  foundedMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}

export class EnrichDomainDto {
  @IsString()
  domain!: string;
}

export class NlSearchDto {
  @IsString()
  prompt!: string;

  @IsIn(['people', 'companies'])
  tab!: 'people' | 'companies';
}
