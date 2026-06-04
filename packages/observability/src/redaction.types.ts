export type RedactionOptions = {
  maxStringLength?: number;
};

export type SummarizedString = {
  type: "string";
  length: number;
  previewHash: string;
};
