import { Bee, BeeDebug, Reference } from '@ethersphere/bee-js';
import { Bytes } from '@ethersphere/bee-js/dist/src/utils/bytes';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reference as ByteReference } from 'sepatree';
import { stringToUint8Array } from 'src/utils';

@Injectable()
export class BeeService {
  private bee: Bee;
  private beeDebug: BeeDebug;
  /** Active postage batch id used for uploading stuff */
  private postageBatchId: string;

  public constructor(private configService: ConfigService) {
    Logger.log(`Bee API EP: ${this.configService.get<string>('BEE_API_URL')}`);
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

  public async saveDataByteReference(data: Uint8Array): Promise<ByteReference> {
    const reference = await this.saveData(data);

    return stringToUint8Array(reference) as Bytes<32>;
  }

  public async loadData(reference: string): Promise<Uint8Array> {
    return this.bee.downloadData(reference);
  }

  public getApiUrl(): string {
    return this.bee.url;
  }
}
