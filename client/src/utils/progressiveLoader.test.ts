import {
  processProgressively,
  loadProgressively,
  createBatchProcessor
} from './progressiveLoader';

describe('Progressive Loader Utility', () => {
  // Mock timers for testing delays
  jest.useFakeTimers();

  describe('processProgressively', () => {
    it('should process all items in chunks', async () => {
      const items = Array.from({ length: 150 }, (_, i) => i);
      const processFunction = jest.fn((item: number) => item * 2);
      const onProgress = jest.fn();
      const onComplete = jest.fn();

      const promise = processProgressively(items, processFunction, {
        chunkSize: 50,
        onProgress,
        onComplete
      });

      // Fast-forward timers to complete all async operations
      jest.runAllTimers();
      const results = await promise;

      // Check that all items were processed correctly
      expect(results).toHaveLength(150);
      expect(results).toEqual(items.map(i => i * 2));
      
      // Check that the process function was called for each item
      expect(processFunction).toHaveBeenCalledTimes(150);
      
      // Check that progress was reported correctly (3 chunks of 50 items)
      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenNthCalledWith(1, 50, 150);
      expect(onProgress).toHaveBeenNthCalledWith(2, 100, 150);
      expect(onProgress).toHaveBeenNthCalledWith(3, 150, 150);
      
      // Check that onComplete was called with the results
      expect(onComplete).toHaveBeenCalledWith(results);
    });

    it('should handle async process functions', async () => {
      const items = [1, 2, 3, 4, 5];
      const processFunction = jest.fn(async (item: number) => {
        return item * 3;
      });

      const results = await processProgressively(items, processFunction);
      
      expect(results).toEqual([3, 6, 9, 12, 15]);
      expect(processFunction).toHaveBeenCalledTimes(5);
    });

    it('should respect chunk delay', async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const processFunction = jest.fn((item: number) => item);
      
      const promise = processProgressively(items, processFunction, {
        chunkSize: 2,
        chunkDelay: 100
      });
      
      // Should process first chunk immediately
      expect(processFunction).toHaveBeenCalledTimes(2);
      
      // Advance timers by 100ms to process second chunk
      jest.advanceTimersByTime(100);
      expect(processFunction).toHaveBeenCalledTimes(4);
      
      // Advance timers by 100ms to process third chunk
      jest.advanceTimersByTime(100);
      expect(processFunction).toHaveBeenCalledTimes(6);
      
      // Complete the promise
      jest.runAllTimers();
      await promise;
    });

    it('should handle errors in process function', async () => {
      const items = [1, 2, 3, 4, 5];
      const processFunction = jest.fn((item: number) => {
        if (item === 3) throw new Error('Test error');
        return item;
      });
      const onError = jest.fn();

      await expect(
        processProgressively(items, processFunction, { onError })
      ).rejects.toThrow('Test error');
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('loadProgressively', () => {
    it('should load data in chunks until no more data', async () => {
      // Mock data loader that returns chunks of data
      const mockDataLoader = jest.fn()
        .mockResolvedValueOnce({ data: [1, 2, 3], hasMore: true })
        .mockResolvedValueOnce({ data: [4, 5, 6], hasMore: true })
        .mockResolvedValueOnce({ data: [7, 8], hasMore: false });
      
      const onProgress = jest.fn();
      const onComplete = jest.fn();
      
      const results = await loadProgressively(mockDataLoader, {
        pageSize: 3,
        onProgress,
        onComplete
      });
      
      // Check that all data was loaded
      expect(results).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      
      // Check that data loader was called with correct offsets
      expect(mockDataLoader).toHaveBeenCalledTimes(3);
      expect(mockDataLoader).toHaveBeenNthCalledWith(1, 0, 3);
      expect(mockDataLoader).toHaveBeenNthCalledWith(2, 3, 3);
      expect(mockDataLoader).toHaveBeenNthCalledWith(3, 6, 3);
      
      // Check that progress was reported correctly
      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenNthCalledWith(1, 3);
      expect(onProgress).toHaveBeenNthCalledWith(2, 6);
      expect(onProgress).toHaveBeenNthCalledWith(3, 8);
      
      // Check that onComplete was called with the results
      expect(onComplete).toHaveBeenCalledWith(results);
    });

    it('should respect maxItems limit', async () => {
      const mockDataLoader = jest.fn()
        .mockResolvedValueOnce({ data: [1, 2, 3], hasMore: true })
        .mockResolvedValueOnce({ data: [4, 5, 6], hasMore: true });
      
      const results = await loadProgressively(mockDataLoader, {
        pageSize: 3,
        maxItems: 5
      });
      
      // Should only load 5 items even though more are available
      expect(results).toEqual([1, 2, 3, 4, 5]);
      expect(mockDataLoader).toHaveBeenCalledTimes(2);
    });

    it('should handle errors in data loader', async () => {
      const mockDataLoader = jest.fn()
        .mockResolvedValueOnce({ data: [1, 2, 3], hasMore: true })
        .mockRejectedValueOnce(new Error('Loading error'));
      
      const onError = jest.fn();
      
      await expect(
        loadProgressively(mockDataLoader, { onError })
      ).rejects.toThrow('Loading error');
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('createBatchProcessor', () => {
    it('should process items in batches', async () => {
      const items = Array.from({ length: 25 }, (_, i) => i);
      const processFn = jest.fn(async (batch: number[]) => {
        return batch.map(item => item * 2);
      });
      const onBatchComplete = jest.fn();
      
      const batchProcessor = createBatchProcessor(processFn, {
        maxBatchSize: 10,
        onBatchComplete
      });
      
      const results = await batchProcessor(items);
      
      // Check that all items were processed
      expect(results).toEqual(items.map(i => i * 2));
      
      // Check that processFn was called for each batch
      expect(processFn).toHaveBeenCalledTimes(3);
      expect(processFn).toHaveBeenNthCalledWith(1, items.slice(0, 10));
      expect(processFn).toHaveBeenNthCalledWith(2, items.slice(10, 20));
      expect(processFn).toHaveBeenNthCalledWith(3, items.slice(20, 25));
      
      // Check that onBatchComplete was called for each batch
      expect(onBatchComplete).toHaveBeenCalledTimes(3);
    });

    it('should respect processing delay between batches', async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const processFn = jest.fn(async (batch: number[]) => batch);
      
      const batchProcessor = createBatchProcessor(processFn, {
        maxBatchSize: 2,
        processingDelay: 100
      });
      
      const promise = batchProcessor(items);
      
      // Should process first batch immediately
      expect(processFn).toHaveBeenCalledTimes(1);
      
      // Advance timers by 100ms to process second batch
      jest.advanceTimersByTime(100);
      expect(processFn).toHaveBeenCalledTimes(2);
      
      // Advance timers by 100ms to process third batch
      jest.advanceTimersByTime(100);
      expect(processFn).toHaveBeenCalledTimes(3);
      
      // Complete the promise
      jest.runAllTimers();
      await promise;
    });

    it('should handle errors in batch processing', async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const processFn = jest.fn(async (batch: number[]) => {
        if (batch.includes(3)) throw new Error('Batch error');
        return batch;
      });
      const onError = jest.fn();
      
      const batchProcessor = createBatchProcessor(processFn, {
        maxBatchSize: 2,
        onError
      });
      
      await expect(batchProcessor(items)).rejects.toThrow('Batch error');
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
}); 