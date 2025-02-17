import BaseModel, { ModelType } from '../../../BaseModel';
import { Request } from '../Api';
import defaultLoadOptions from '../utils/defaultLoadOptions';
import { ErrorBadRequest, ErrorMethodNotAllowed } from '../utils/errors';
import requestFields from '../utils/requestFields';
import collectionToPaginatedResults from '../utils/collectionToPaginatedResults';
import BaseItem from '../../../models/BaseItem';
import { NoteEntity } from '../../database/types';
import SearchEngineUtils, { NotesForQueryOptions } from '../../searchengine/SearchEngineUtils';

export default async function(request: Request) {
	if (request.method !== 'GET') throw new ErrorMethodNotAllowed();

	const query = request.query.query;
	if (!query) throw new ErrorBadRequest('Missing "query" parameter');

	const modelType = request.query.type ? BaseModel.modelNameToType(request.query.type) : BaseModel.TYPE_NOTE;

	let results: NoteEntity[] = [];

	if (modelType !== BaseItem.TYPE_NOTE) {
		const ModelClass = BaseItem.getClassByItemType(modelType);
		const options: any = {};
		const fields = requestFields(request, modelType);
		if (fields.length) options.fields = fields;
		const sqlQueryPart = query.replace(/\*/g, '%');
		options.where = 'title LIKE ?';
		options.whereParams = [sqlQueryPart];
		options.caseInsensitive = true;
		results = await ModelClass.all(options);
	} else {
		const options: NotesForQueryOptions = {
			...defaultLoadOptions(request, ModelType.Note),
			appendWildCards: true,
		};
		results = (await SearchEngineUtils.notesForQuery(query, false, options)).notes;
	}

	return collectionToPaginatedResults(modelType, results, request);
}
