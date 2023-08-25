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
        and OITM.FirmCode='${FirmCode}'
        ${includeNoStock ? '' : 'and OITM.onHand > 0'}
    `
    return query
}