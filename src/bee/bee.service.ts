import { Bee, BeeDebug, Reference } from '@ethersphere/bee-js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BeeService {
  private bee: Bee;
  private beeDebug: BeeDebug;
  /** Active postage batch id used for uploading stuff */
  private postageBatchId: string;

  public constructor(private configService: ConfigService) {
    this.bee = new Bee(this.configService.get<string>('BEE_API_URL'));
    this.beeDebug = new BeeDebug(
      this.configService.get<string>('BEE_DEBUG_API_URL'),
    );
    this.postageBatchId = this.configService.get<string>('BEE_STAMP');
  }

  public async saveData(data: Uint8Array): Promise<Reference> {
    const { reference } = await this.bee.uploadData(this.postageBatchId, data);

    return reference;
  }

  public async loadData(reference: string): Promise<Uint8Array> {
    return this.bee.downloadData(reference);
  }
}
