import { PartialType } from '@nestjs/swagger';
import { CreatePromoAdDto } from './create-promo-ad.dto';

export class UpdatePromoAdDto extends PartialType(CreatePromoAdDto) {}
