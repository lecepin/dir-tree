/// <reference types="@ice/app/types" />

interface ISCanFile {
  name: string;
  isFile: boolean;
  children?: Array<ISCanFile>;
  size?: number;
}
