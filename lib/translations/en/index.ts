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
import { monthly, monthlyDetail, monthlyEdit, monthlyNew } from "./monthly";
import { para } from "./para";
import { paraProjectDetail } from "./para-project-detail";
import { settings } from "./settings";
import { retrospective } from "./retrospective";
import { aiPlanGenerator } from "./ai-plan-generator";

export const en = {
  common,
  bottomNav,
  theme,
  language,
  home,
  monthly,
  monthlyDetail,
  monthlyEdit,
  monthlyNew,
  para,
  paraProjectDetail,
  settings,
  retrospective,
  aiPlanGenerator,
  pageLoading,
  noteForm,
  charts,
} as const;
