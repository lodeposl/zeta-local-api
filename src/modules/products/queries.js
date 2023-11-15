export const PRODUCT_BY_CODE = function(ItemCode){
    return `
    select 
        OITM.ItemCode,
        ItemName,
        onHand,
        Price,
        OMRC.FirmName,
        OMRC.FirmCode
    from 
        OITM 
    join 
        ITM1 
            on OITM.ItemCode = ITM1.ItemCode 
    join
        OMRC
            on OITM.FirmCode = OMRC.FirmCode
    where 
        OITM.frozenFor = 'N'
        and PriceList=3 
        and OITM.ItemCode='${ItemCode}'`
}

export const FIRM_AND_COUNT = function(includeNoStock){
    const query = `
    select
        OMRC.FirmCode,
        FirmName,
        COUNT(OMRC.FirmCode) amountProducts
    from OMRC 
    join OITM 
        on OMRC.FirmCode = OITM.FirmCode
    where
        OITM.frozenFor = 'N'
        ${ includeNoStock ? '' : 'and OITM.OnHand > 0'}
    group by
        OMRC.FirmCode,
        OMRC.FirmName 
    order by FirmName asc`
    return query
}

export const PRODUCTS_BY_MARCA = function(FirmCode, includeNoStock){
    const query = `
    select 
        OITM.ItemCode,
        ItemName,
        onHand,
        Price,
        OMRC.FirmName,
        OMRC.FirmCode,
        OITM.ItmsGrpCod
    from 
        OITM 
    join 
        ITM1 
            on OITM.ItemCode = ITM1.ItemCode 
    join
        OMRC
            on OITM.FirmCode = OMRC.FirmCode
    where 
        OITM.frozenFor = 'N'
        and PriceList=3 
        and OITM.FirmCode='${FirmCode}'
        ${includeNoStock ? '' : 'and OITM.onHand > 0'}
    `
    return query
}

export const MARCAS = function(){
    const query = `
    select
        FirmCode,
        FirmName
    from OMRC 
    order by FirmName asc`
    return query;
}

export const ALL_PRODUCTS = function(){
    const query = `
        select 
            OITM.ItemCode,
            OITM.ItmsGrpCod,
            ItemName,
            onHand,
            Price,
            FirmCode,
            frozenFor
        from 
            OITM 
        join 
            ITM1 
                on OITM.ItemCode = ITM1.ItemCode 
        where 
            PriceList=3 
    `
    return query

}

export const ITEM_GROUPS = function(){
    const query = `
    select ItmsGrpCod, ItmsGrpNam from OITB
    `
    return query
}

