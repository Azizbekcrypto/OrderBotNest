import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../core/entity';
import { CatalogService } from './catalog.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
