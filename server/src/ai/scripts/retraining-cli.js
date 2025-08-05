#!/usr/bin/env node
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const { automatedRetrainingService } = require('../index');

const main = async () => {
  yargs(hideBin(process.argv))
    .command('status <modelId>', 'Show retrain status for a model', {}, async argv => {
      const status = await automatedRetrainingService.getLastRetrainStatus(argv.modelId);
      const next = automatedRetrainingService.getNextEligibleRetrainTime(argv.modelId);
      console.log('Status:', status);
      console.log('Next eligible retrain:', next);
    })
    .command('history <modelId>', 'Show retrain history for a model', {}, async argv => {
      const history = await automatedRetrainingService.getRetrainHistory(argv.modelId);
      console.log(JSON.stringify(history, null, 2));
    })
    .command('trigger <modelId>', 'Trigger retraining for a model', {
      reason: { type: 'string', default: 'manual', describe: 'Reason for retrain' },
      event: { type: 'string', default: '{}', describe: 'Event JSON' }
    }, async argv => {
      const event = JSON.parse(argv.event);
      await automatedRetrainingService.triggerRetraining(argv.modelId, argv.reason, event);
      console.log('Retraining triggered.');
    })
    .command('approve <modelId>', 'Approve retrain for a model', {}, async argv => {
      if (automatedRetrainingService.approvalCallback) {
        await automatedRetrainingService.approvalCallback({ modelId: argv.modelId, approved: true });
        console.log('Retrain approved.');
      } else {
        console.log('No approval callback set.');
      }
    })
    .command('deny <modelId>', 'Deny retrain for a model', {}, async argv => {
      if (automatedRetrainingService.approvalCallback) {
        await automatedRetrainingService.approvalCallback({ modelId: argv.modelId, approved: false });
        console.log('Retrain denied.');
      } else {
        console.log('No approval callback set.');
      }
    })
    .demandCommand(1)
    .help()
    .argv;
};

main(); 