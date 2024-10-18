import logger from "../../logger/index.js";
import { oamoCredentialModelDefinition } from "./oamoModelDefinitions.js";

export default class OamoCredentialPlugin {

  oamoCredentialModelId = "kjzl6hvfrbw6c9cjpo0punf40mcppjji9ef229h5u0w55m2v2xox15ognrs6oev"
  oamoPublicProfileModelId = "kjzl6hvfrbw6c76tpxlxw283jc3oyxu9bd7294ibyvfyetcagod6gesva8vlx0c"
  oamoRelationModelId = "kjzl6hvfrbw6c61x15yq8phxqb1jdjtng2zmfipj54smmhlu0d2die78wp1n62w"

  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    // Create the OamoCredential model
    //await this.createModel(); // this creates the test model
   // await this.start() // creates test stream

    // Register hooks
    return {
      HOOKS: {
        generate: () => this.start(),
        validate: (stream) => this.isValid(stream),
        add_metadata: (stream) => this.addMetadata(stream),
      },
      ROUTES: {}, // No routes needed for this plugin
    };
  }

  /** 
   * Creates the OamoCredential model.
   * Does not check for existing models; assumes model does not exist.
   */
  async createModel() {
    try {
      // Create the model using the global indexingService
      const model = await global.indexingService.ceramic.orbisdb.ceramic.createModel(oamoCredentialModelDefinition);
      this.model_id = model.id; // Store the created model's ID
      logger.info("Model 'OamoCredential' created successfully with ID:", this.model_id);
    } catch (error) {
      logger.error("Error creating the 'OamoCredential' model:", error);
      throw error; // Re-throw to prevent further execution if model creation fails
    }
  }

  /** 
   * Will kickstart the generation of a new stream 
   */
  async start() {
    logger.info(
      "Start subscription in OamoCredentialPlugin to generate a new stream every " +
        this.secs_interval +
        " seconds"
    );

    // Perform first call
    this.createStream();

    if (!this.secs_interval) {
      return logger.error("The interval hasn't been specified");
    } 

    // Start the interval function
    this.interval = setInterval(
      () => {
        this.createStream();
      },
      // Make sure we don't exceed timeout interval
      5000
    );
  }

  /** 
   * Will stop the plugin's interval 
   */
  async stop() {
    logger.info("Stopping OamoCredentialPlugin");
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null; // Clear the stored interval ID
    }
  }

  /** 
   * Creates a new stream based on the OamoCredential model with dynamic content.
   */
  async createStream() {
    logger.info("OamoCredentialPlugin: Creating a new OamoCredential stream.");

    // Construct the content object adhering to the schema
    const content = this.generateDynamicContent();

    /** We then create the stream in Ceramic with the updated content */
    try {
      console.log("this.context", this.context)
      console.log("this.model Id: ", this.model_id)
      const stream = await global.indexingService.ceramic.orbisdb
        .insert(this.model_id)
        .value({})
        //.context(this.context)
        .run();
      logger.info("Stream created in OamoCredentialPlugin with ID:", stream.id);
    } catch (e) {
      logger.error(
        "Error creating stream with model ID " + this.model_id + ":",
        e
      );
    }
  }

  /** 
   * Will mark all of the streams as valid 
   */
  isValid(stream) {
    if(stream.model === this.oamoCredentialModelId || 
      stream.model === this.oamoPublicProfileModelId ||
      stream.model === this.oamoRelationModelId
    ) {
      return true;
    } else {
      return false;
    }
  }

  /** 
   * Returns a metadata key-value pair which will be added to the plugins_data field 
   */
  async addMetadata(stream) {
    return {
      oamo: "test",
    };
  }

  /** 
   * Generates dynamic content for the OamoCredential stream.
   * @returns {Object} - The dynamic content object adhering to the schema.
   */
  generateDynamicContent() {
    return {
      status: "ACTIVE",
      version: 1,
      chainID: 1, // Example chain ID (e.g., Ethereum mainnet)
      chainName: "Ethereum",
      rootCredential: this.generateUniqueCredential(),
      category: "exampleCategory",
      verifiableCredential: this.generateUniqueCredential(),
      createdOn: new Date().toISOString(),
      updatedOn: new Date().toISOString(),
    };
  }

  /** 
   * Generates a unique credential string.
   * @returns {string} - A unique credential string.
   */
  generateUniqueCredential() {
    return `credential-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}