/**
 * 首页banner
 */
export interface BannerVO {
  encodeId: string;
  exclusive: boolean;
  imageUrl: string;
  scm: string;
  targetId: number;
  targetType: number;
  titleColor: string;
  typeTitle: string;
}

/**
 * banner响应结果
 */
export interface BannerRes {
  banners: BannerVO[];
  code: number;
}
