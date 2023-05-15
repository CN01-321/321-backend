import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Carer = Profile & PublicProfile & {
  __typename?: 'Carer';
  address: Scalars['String'];
  bio?: Maybe<Scalars['String']>;
  email: Scalars['String'];
  feedback: Array<Feedback>;
  id: Scalars['ID'];
  latitude: Scalars['Float'];
  licences: Array<Licence>;
  longitude: Scalars['Float'];
  name: Scalars['String'];
  pfp?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  preferedPets: Array<PetPreference>;
  requests: Array<Request>;
  unavailability: Array<Unavailability>;
};

export type Feedback = {
  __typename?: 'Feedback';
  comment: Scalars['String'];
  commenter: PublicProfile;
  img?: Maybe<Scalars['String']>;
  rating?: Maybe<Scalars['Int']>;
  replies: Array<Reply>;
};

export type Licence = {
  __typename?: 'Licence';
  licenceName: Scalars['String'];
  licenceNo: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addOwner?: Maybe<Owner>;
};


export type MutationAddOwnerArgs = {
  name?: InputMaybe<Scalars['String']>;
};

export type Offer = {
  __typename?: 'Offer';
  details: Scalars['String'];
  endDay: Scalars['String'];
  id: Scalars['ID'];
  requestedPets: Array<Pet>;
  startDay: Scalars['String'];
};

export type Owner = Profile & PublicProfile & {
  __typename?: 'Owner';
  address: Scalars['String'];
  bio?: Maybe<Scalars['String']>;
  email: Scalars['String'];
  feedback: Array<Feedback>;
  id: Scalars['ID'];
  latitude: Scalars['Float'];
  longitude: Scalars['Float'];
  name: Scalars['String'];
  offer: Array<Offer>;
  pets: Array<Pet>;
  pfp?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
};

export type Pet = PublicProfile & {
  __typename?: 'Pet';
  bio?: Maybe<Scalars['String']>;
  feedback: Array<Feedback>;
  id: Scalars['ID'];
  isFriendly?: Maybe<Scalars['Boolean']>;
  isNeutered?: Maybe<Scalars['Boolean']>;
  isVaccinated?: Maybe<Scalars['Boolean']>;
  name: Scalars['String'];
  petSize: PetSize;
  petType: PetType;
  pfp?: Maybe<Scalars['String']>;
};

export type PetPreference = {
  __typename?: 'PetPreference';
  petSize: PetSize;
  petType: PetType;
};

export enum PetSize {
  Large = 'LARGE',
  Medium = 'MEDIUM',
  Small = 'SMALL'
}

export enum PetType {
  Bird = 'BIRD',
  Cat = 'CAT',
  Dog = 'DOG',
  Rabbit = 'RABBIT'
}

export type Profile = {
  address: Scalars['String'];
  bio?: Maybe<Scalars['String']>;
  email: Scalars['String'];
  feedback: Array<Feedback>;
  id: Scalars['ID'];
  latitude: Scalars['Float'];
  longitude: Scalars['Float'];
  name: Scalars['String'];
  pfp?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
};

export type PublicProfile = {
  bio?: Maybe<Scalars['String']>;
  feedback: Array<Feedback>;
  id: Scalars['ID'];
  name: Scalars['String'];
  pfp?: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  publicProfile?: Maybe<PublicProfile>;
};


export type QueryPublicProfileArgs = {
  id: Scalars['ID'];
};

export type Reply = {
  __typename?: 'Reply';
  comment: Scalars['String'];
  replier: PublicProfile;
};

export type Request = {
  __typename?: 'Request';
  details: Scalars['String'];
  endDay: Scalars['String'];
  id: Scalars['ID'];
  owner: Owner;
  requestedPets: Array<Pet>;
  startDay: Scalars['String'];
  staus: RequestStatus;
  transactions: Array<Transaction>;
};

export enum RequestStatus {
  Complete = 'COMPLETE',
  Paid = 'PAID',
  Pending = 'PENDING'
}

export type Transaction = {
  __typename?: 'Transaction';
  date: Scalars['String'];
  status: TransactionStatus;
};

export enum TransactionStatus {
  Paid = 'PAID',
  Refunded = 'REFUNDED'
}

export type Unavailability = {
  __typename?: 'Unavailability';
  startDay: Scalars['String'];
};

export type AdditionalEntityFields = {
  path?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<Scalars['String']>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Carer: ResolverTypeWrapper<Carer>;
  String: ResolverTypeWrapper<Scalars['String']>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  Feedback: ResolverTypeWrapper<Feedback>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Licence: ResolverTypeWrapper<Licence>;
  Mutation: ResolverTypeWrapper<{}>;
  Offer: ResolverTypeWrapper<Offer>;
  Owner: ResolverTypeWrapper<Owner>;
  Pet: ResolverTypeWrapper<Pet>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  PetPreference: ResolverTypeWrapper<PetPreference>;
  PetSize: PetSize;
  PetType: PetType;
  Profile: ResolversTypes['Carer'] | ResolversTypes['Owner'];
  PublicProfile: ResolversTypes['Carer'] | ResolversTypes['Owner'] | ResolversTypes['Pet'];
  Query: ResolverTypeWrapper<{}>;
  Reply: ResolverTypeWrapper<Reply>;
  Request: ResolverTypeWrapper<Request>;
  RequestStatus: RequestStatus;
  Transaction: ResolverTypeWrapper<Transaction>;
  TransactionStatus: TransactionStatus;
  Unavailability: ResolverTypeWrapper<Unavailability>;
  AdditionalEntityFields: AdditionalEntityFields;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Carer: Carer;
  String: Scalars['String'];
  ID: Scalars['ID'];
  Float: Scalars['Float'];
  Feedback: Feedback;
  Int: Scalars['Int'];
  Licence: Licence;
  Mutation: {};
  Offer: Offer;
  Owner: Owner;
  Pet: Pet;
  Boolean: Scalars['Boolean'];
  PetPreference: PetPreference;
  Profile: ResolversParentTypes['Carer'] | ResolversParentTypes['Owner'];
  PublicProfile: ResolversParentTypes['Carer'] | ResolversParentTypes['Owner'] | ResolversParentTypes['Pet'];
  Query: {};
  Reply: Reply;
  Request: Request;
  Transaction: Transaction;
  Unavailability: Unavailability;
  AdditionalEntityFields: AdditionalEntityFields;
};

export type UnionDirectiveArgs = {
  discriminatorField?: Maybe<Scalars['String']>;
  additionalFields?: Maybe<Array<Maybe<AdditionalEntityFields>>>;
};

export type UnionDirectiveResolver<Result, Parent, ContextType = any, Args = UnionDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type AbstractEntityDirectiveArgs = {
  discriminatorField: Scalars['String'];
  additionalFields?: Maybe<Array<Maybe<AdditionalEntityFields>>>;
};

export type AbstractEntityDirectiveResolver<Result, Parent, ContextType = any, Args = AbstractEntityDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type EntityDirectiveArgs = {
  embedded?: Maybe<Scalars['Boolean']>;
  additionalFields?: Maybe<Array<Maybe<AdditionalEntityFields>>>;
};

export type EntityDirectiveResolver<Result, Parent, ContextType = any, Args = EntityDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ColumnDirectiveArgs = {
  overrideType?: Maybe<Scalars['String']>;
};

export type ColumnDirectiveResolver<Result, Parent, ContextType = any, Args = ColumnDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type IdDirectiveArgs = { };

export type IdDirectiveResolver<Result, Parent, ContextType = any, Args = IdDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type LinkDirectiveArgs = {
  overrideType?: Maybe<Scalars['String']>;
};

export type LinkDirectiveResolver<Result, Parent, ContextType = any, Args = LinkDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type EmbeddedDirectiveArgs = { };

export type EmbeddedDirectiveResolver<Result, Parent, ContextType = any, Args = EmbeddedDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type MapDirectiveArgs = {
  path: Scalars['String'];
};

export type MapDirectiveResolver<Result, Parent, ContextType = any, Args = MapDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type CarerResolvers<ContextType = any, ParentType extends ResolversParentTypes['Carer'] = ResolversParentTypes['Carer']> = {
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  feedback?: Resolver<Array<ResolversTypes['Feedback']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  licences?: Resolver<Array<ResolversTypes['Licence']>, ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pfp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  preferedPets?: Resolver<Array<ResolversTypes['PetPreference']>, ParentType, ContextType>;
  requests?: Resolver<Array<ResolversTypes['Request']>, ParentType, ContextType>;
  unavailability?: Resolver<Array<ResolversTypes['Unavailability']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FeedbackResolvers<ContextType = any, ParentType extends ResolversParentTypes['Feedback'] = ResolversParentTypes['Feedback']> = {
  comment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  commenter?: Resolver<ResolversTypes['PublicProfile'], ParentType, ContextType>;
  img?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rating?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  replies?: Resolver<Array<ResolversTypes['Reply']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LicenceResolvers<ContextType = any, ParentType extends ResolversParentTypes['Licence'] = ResolversParentTypes['Licence']> = {
  licenceName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  licenceNo?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addOwner?: Resolver<Maybe<ResolversTypes['Owner']>, ParentType, ContextType, Partial<MutationAddOwnerArgs>>;
};

export type OfferResolvers<ContextType = any, ParentType extends ResolversParentTypes['Offer'] = ResolversParentTypes['Offer']> = {
  details?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endDay?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  requestedPets?: Resolver<Array<ResolversTypes['Pet']>, ParentType, ContextType>;
  startDay?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OwnerResolvers<ContextType = any, ParentType extends ResolversParentTypes['Owner'] = ResolversParentTypes['Owner']> = {
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  feedback?: Resolver<Array<ResolversTypes['Feedback']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  offer?: Resolver<Array<ResolversTypes['Offer']>, ParentType, ContextType>;
  pets?: Resolver<Array<ResolversTypes['Pet']>, ParentType, ContextType>;
  pfp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PetResolvers<ContextType = any, ParentType extends ResolversParentTypes['Pet'] = ResolversParentTypes['Pet']> = {
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  feedback?: Resolver<Array<ResolversTypes['Feedback']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isFriendly?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  isNeutered?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  isVaccinated?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  petSize?: Resolver<ResolversTypes['PetSize'], ParentType, ContextType>;
  petType?: Resolver<ResolversTypes['PetType'], ParentType, ContextType>;
  pfp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PetPreferenceResolvers<ContextType = any, ParentType extends ResolversParentTypes['PetPreference'] = ResolversParentTypes['PetPreference']> = {
  petSize?: Resolver<ResolversTypes['PetSize'], ParentType, ContextType>;
  petType?: Resolver<ResolversTypes['PetType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProfileResolvers<ContextType = any, ParentType extends ResolversParentTypes['Profile'] = ResolversParentTypes['Profile']> = {
  __resolveType: TypeResolveFn<'Carer' | 'Owner', ParentType, ContextType>;
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  feedback?: Resolver<Array<ResolversTypes['Feedback']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pfp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type PublicProfileResolvers<ContextType = any, ParentType extends ResolversParentTypes['PublicProfile'] = ResolversParentTypes['PublicProfile']> = {
  __resolveType: TypeResolveFn<'Carer' | 'Owner' | 'Pet', ParentType, ContextType>;
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  feedback?: Resolver<Array<ResolversTypes['Feedback']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pfp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  publicProfile?: Resolver<Maybe<ResolversTypes['PublicProfile']>, ParentType, ContextType, RequireFields<QueryPublicProfileArgs, 'id'>>;
};

export type ReplyResolvers<ContextType = any, ParentType extends ResolversParentTypes['Reply'] = ResolversParentTypes['Reply']> = {
  comment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  replier?: Resolver<ResolversTypes['PublicProfile'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RequestResolvers<ContextType = any, ParentType extends ResolversParentTypes['Request'] = ResolversParentTypes['Request']> = {
  details?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endDay?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  requestedPets?: Resolver<Array<ResolversTypes['Pet']>, ParentType, ContextType>;
  startDay?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  staus?: Resolver<ResolversTypes['RequestStatus'], ParentType, ContextType>;
  transactions?: Resolver<Array<ResolversTypes['Transaction']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Transaction'] = ResolversParentTypes['Transaction']> = {
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['TransactionStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UnavailabilityResolvers<ContextType = any, ParentType extends ResolversParentTypes['Unavailability'] = ResolversParentTypes['Unavailability']> = {
  startDay?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Carer?: CarerResolvers<ContextType>;
  Feedback?: FeedbackResolvers<ContextType>;
  Licence?: LicenceResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Offer?: OfferResolvers<ContextType>;
  Owner?: OwnerResolvers<ContextType>;
  Pet?: PetResolvers<ContextType>;
  PetPreference?: PetPreferenceResolvers<ContextType>;
  Profile?: ProfileResolvers<ContextType>;
  PublicProfile?: PublicProfileResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Reply?: ReplyResolvers<ContextType>;
  Request?: RequestResolvers<ContextType>;
  Transaction?: TransactionResolvers<ContextType>;
  Unavailability?: UnavailabilityResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = any> = {
  union?: UnionDirectiveResolver<any, any, ContextType>;
  abstractEntity?: AbstractEntityDirectiveResolver<any, any, ContextType>;
  entity?: EntityDirectiveResolver<any, any, ContextType>;
  column?: ColumnDirectiveResolver<any, any, ContextType>;
  id?: IdDirectiveResolver<any, any, ContextType>;
  link?: LinkDirectiveResolver<any, any, ContextType>;
  embedded?: EmbeddedDirectiveResolver<any, any, ContextType>;
  map?: MapDirectiveResolver<any, any, ContextType>;
};

import { ObjectId } from 'mongodb';