import SpaceCategoryAnalyze from './SpaceCategoryAnalyze';
import SpaceRankAnalyze from './SpaceRankAnalyze';
import SpaceSizeAnalyze from './SpaceSizeAnalyze';
import SpaceTagAnalyze from './SpaceTagAnalyze';
import SpaceUsageAnalyze from './SpaceUsageAnalyze';
import SpaceUserAnalyze from './SpaceUserAnalyze';
import common from './common';

export default {
  ...SpaceCategoryAnalyze,
  ...SpaceRankAnalyze,
  ...SpaceSizeAnalyze,
  ...SpaceTagAnalyze,
  ...SpaceUsageAnalyze,
  ...SpaceUserAnalyze,
  ...common,
};
