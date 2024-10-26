<script>
  let nodeStatus = 'Connecting...';
  let nodeAddress = 'http://localhost:8545';

  function connectToNode() {
    // Código para conectarse al nodo y actualizar el estado
    nodeStatus = 'Connected';
  }
</script>

<div class="bg-white shadow-md rounded-lg p-6">
  <h2 class="text-xl font-bold mb-4">Node Connection</h2>
  <p>Node Address: {nodeAddress}</p>
  <p>Status: {nodeStatus}</p>
  <button class="btn btn-primary mt-4" on:click={connectToNode}>
    Connect to Node
  </button>
</div>
