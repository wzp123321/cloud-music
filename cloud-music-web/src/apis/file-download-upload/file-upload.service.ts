// 文件上传

import { ref } from 'vue';
import { FUploadHandler, verifyUpload } from './util';

class FileUploadService {
  //#region
  private _type = ref<'导入' | '上传'>('导入');
  private _is_initial = ref<boolean>(false);
  private _accept = ref<{ [key: string]: string }>({});
  private _single_limit_size = ref<number>(0);
  private _total_limit_size = ref<number>(0);
  //#endregion

  constructor(type: '导入' | '上传', extension: { [key: string]: string }, singleSize: number, totalSize: number) {
    this._type.value = type;
    this._is_initial.value = true;
    this._accept.value = extension;
    this._single_limit_size.value = singleSize;
    this._total_limit_size.value = totalSize;
  }

  // 选择文件并做大小 / 类型校验；校验不通过返回 null
  fileImport = async (list: File[]): Promise<File | null> => {
    if (!this._is_initial.value) {
      throw new Error('尚未初始化！');
    }
    const file = await FUploadHandler(Object.keys(this._accept.value).join());
    if (
      !verifyUpload(list, file, this._single_limit_size.value, this._accept.value, this._total_limit_size.value)
    ) {
      return null;
    }
    return file;
  };
}

export default FileUploadService;
