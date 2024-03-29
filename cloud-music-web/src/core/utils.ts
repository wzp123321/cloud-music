import dayjs from 'dayjs';

/**
 * 格式化时间戳为hour:min:sec
 * @param timeStamp
 * @returns
 */
export function formatDuration(timeStamp: number) {
  if (!timeStamp) {
    return '00:00';
  }
  const hour = Math.floor(timeStamp / (60 * 60 * 1000));
  const min = Math.floor((timeStamp - hour * 60 * 60 * 1000) / (60 * 1000));
  const sec = Math.floor((timeStamp - min * 60 * 1000) / 1000);

  return `${hour > 0 ? (hour > 9 ? hour.toFixed(0) : 0 + hour.toFixed(0) + ':') : ''}${
    min > 9 ? min.toFixed(0) : '0' + min.toFixed(0)
  }:${sec > 9 ? sec.toFixed(0) : 0 + sec.toFixed(0)}`;
}

/**
 * 格式化人数
 * @param timeStamp
 * @returns
 */
export function formatPlayCount(count: number) {
  const unit = count > 9999 ? 'w' : '';
  const fCount = count > 9999 ? Number((count / 10000).toFixed(1)) : count;
  return `${fCount}${unit}`;
}

/**
 * 日期格式化
 * @param timeStamp
 * @param formatStr
 * @returns
 */
export const formatDate = (timeStamp: number | Date, formatStr: string) => {
  return dayjs(timeStamp).format(formatStr);
};
