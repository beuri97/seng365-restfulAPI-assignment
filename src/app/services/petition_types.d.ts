type Petition = {
    petitionId : number,
    title : string,
    categoryId : number,
    ownerId : number,
    ownerFirstName : string,
    ownerLastName : string,
    numberOfSupporters : number,
    creationDate : string,
    description : string,
    supportingCost: number,
    moneyRaised : number,
    supportTiers : SupporterTier[];
}