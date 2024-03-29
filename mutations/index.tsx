import approve from "./approve.gql";
import bond from "./bond.gql";
import unbond from "./unbond.gql";
import withdrawStake from "./withdrawStake.gql";
import withdrawFees from "./withdrawFees.gql";
import rebondFromUnbonded from "./rebondFromUnbonded.gql";
import rebond from "./rebond.gql";
import createPoll from "./createPoll.gql";
import vote from "./vote.gql";
import initializeRound from "./initializeRound.gql";
import claimStake from "./claimStake.gql";

const mutations = {
  approve,
  bond,
  unbond,
  withdrawStake,
  withdrawFees,
  rebondFromUnbonded,
  rebond,
  createPoll,
  vote,
  initializeRound,
  claimStake,
};

export default mutations;
