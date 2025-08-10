import {
  common,
  bottomNav,
  theme,
  language,
  pageLoading,
  noteForm,
  charts,
} from "./common";
import { home } from "./home";
import { chapter, chapterDetail, chapterEdit, chapterNew } from "./chapter";
import { para } from "./para";
import { paraProjectDetail } from "./para-project-detail";
import { settings } from "./settings";
import { retrospective } from "./retrospective";

export const en = {
  common,
  bottomNav,
  theme,
  language,
  home,
  chapter,
  chapterDetail,
  chapterEdit,
  chapterNew,
  para,
  paraProjectDetail,
  settings,
  retrospective,
  pageLoading,
  noteForm,
  charts,
} as const;
